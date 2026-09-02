import * as tf from "@tensorflow/tfjs";
import type { UserLabel } from "../labels";

export type TrainingExample = {
  features: number[];
  label: UserLabel;
};

export type TrainingMetrics = {
  accuracy: number;
};

export type DrawClassifier = {
  train(
    examples: TrainingExample[],
    classLabels: UserLabel[],
  ): Promise<TrainingMetrics>;
  predictProbabilities(features: number[]): Record<UserLabel, number>;
  save(recordId: string): Promise<void>;
  dispose(): void;
};

export const PREDICTION_TEMPERATURE = 2.5;
const HIDDEN_UNITS = 32;
const TRAINING_EPOCHS = 20;
const LABEL_SMOOTHING = 0.12;
const DROPOUT_RATE = 0.25;
const VALIDATION_HOLDOUT_RATIO = 0.25;

type ExampleSplit = {
  train: TrainingExample[];
  validation: TrainingExample[];
};

function shuffleInPlace<T>(items: T[]): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

export function splitTrainingExamples(
  examples: TrainingExample[],
  classLabels: UserLabel[],
): ExampleSplit {
  const train: TrainingExample[] = [];
  const validation: TrainingExample[] = [];

  for (const label of classLabels) {
    const group = examples.filter((example) => example.label === label);
    shuffleInPlace(group);

    if (group.length <= 1) {
      train.push(...group);
      continue;
    }

    const holdoutCount = Math.max(
      1,
      Math.floor(group.length * VALIDATION_HOLDOUT_RATIO),
    );
    validation.push(...group.slice(0, holdoutCount));
    train.push(...group.slice(holdoutCount));
  }

  return { train, validation };
}

function evaluateHardAccuracy(
  fittedModel: tf.LayersModel,
  examples: TrainingExample[],
  labelToIndex: Record<string, number>,
): number {
  if (examples.length === 0) {
    return 0;
  }

  const features = tf.tensor2d(examples.map((example) => example.features));
  const output = fittedModel.predict(features) as tf.Tensor;
  const predictions = output.argMax(-1).dataSync();
  features.dispose();
  output.dispose();

  let correct = 0;
  for (let index = 0; index < examples.length; index += 1) {
    if (predictions[index] === labelToIndex[examples[index].label]) {
      correct += 1;
    }
  }

  return correct / examples.length;
}

async function buildAndTrainModel(
  examples: TrainingExample[],
  classLabels: UserLabel[],
  labelToIndex: Record<string, number>,
): Promise<tf.LayersModel> {
  const featureSize = examples[0].features.length;
  const features = tf.tensor2d(examples.map((example) => example.features));

  let labels = tf.oneHot(
    tf.tensor1d(
      examples.map((example) => labelToIndex[example.label]),
      "int32",
    ),
    classLabels.length,
  ) as tf.Tensor2D;

  if (LABEL_SMOOTHING > 0) {
    const smoothed = labels
      .mul(1 - LABEL_SMOOTHING)
      .add(LABEL_SMOOTHING / classLabels.length) as tf.Tensor2D;
    labels.dispose();
    labels = smoothed;
  }

  const fittedModel = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [featureSize],
        units: HIDDEN_UNITS,
        activation: "relu",
      }),
      tf.layers.dropout({ rate: DROPOUT_RATE }),
      tf.layers.dense({
        units: classLabels.length,
        activation: "softmax",
      }),
    ],
  });

  fittedModel.compile({
    optimizer: tf.train.adam(0.008),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  await fittedModel.fit(features, labels, {
    epochs: TRAINING_EPOCHS,
    shuffle: true,
    batchSize: Math.min(16, examples.length),
  });

  features.dispose();
  labels.dispose();

  return fittedModel;
}

export function modelUrlForRecord(recordId: string): string {
  return `indexeddb://my-ai-draw-${recordId}`;
}

export function createDrawClassifier(
  initialModel: tf.LayersModel | null = null,
  initialClassLabels?: UserLabel[],
): DrawClassifier {
  let model: tf.LayersModel | null = initialModel;
  let classLabels: UserLabel[] = ["cat", "other"];
  let labelToIndex: Record<string, number> = { cat: 0, other: 1 };

  function setClassLabels(nextClassLabels: UserLabel[]) {
    classLabels = nextClassLabels;
    labelToIndex = Object.fromEntries(
      nextClassLabels.map((label, index) => [label, index]),
    );
  }

  if (initialClassLabels) {
    setClassLabels(initialClassLabels);
  }

  function dispose(): void {
    if (model) {
      const current = model;
      model = null;
      try {
        current.dispose();
      } catch {
        // Model may already be disposed during React StrictMode cleanup races.
      }
    }
  }

  function getProbabilities(features: number[]): number[] {
    if (!model) {
      throw new Error("Train the model before making predictions.");
    }

    const input = tf.tensor2d([features]);
    const output = model.predict(input) as tf.Tensor;
    const raw = output.dataSync();
    input.dispose();
    output.dispose();
    return softenProbabilities(raw, PREDICTION_TEMPERATURE);
  }

  return {
    async train(
      examples: TrainingExample[],
      nextClassLabels: UserLabel[],
    ): Promise<TrainingMetrics> {
      if (examples.length === 0) {
        throw new Error("Label some drawings before training.");
      }

      dispose();
      setClassLabels(nextClassLabels);

      const { train, validation } = splitTrainingExamples(
        examples,
        nextClassLabels,
      );

      let accuracy: number;

      if (validation.length > 0 && train.length > 0) {
        const validationModel = await buildAndTrainModel(
          train,
          nextClassLabels,
          labelToIndex,
        );
        accuracy = evaluateHardAccuracy(
          validationModel,
          validation,
          labelToIndex,
        );
        validationModel.dispose();

        model = await buildAndTrainModel(
          examples,
          nextClassLabels,
          labelToIndex,
        );
      } else {
        model = await buildAndTrainModel(
          examples,
          nextClassLabels,
          labelToIndex,
        );
        accuracy = evaluateHardAccuracy(model, examples, labelToIndex);
      }

      return { accuracy };
    },

    predictProbabilities(features: number[]): Record<UserLabel, number> {
      const probabilities = getProbabilities(features);
      return Object.fromEntries(
        classLabels.map((label, index) => [label, probabilities[index]]),
      ) as Record<UserLabel, number>;
    },

    async save(recordId: string): Promise<void> {
      if (!model) {
        throw new Error("Train the model before saving.");
      }
      await model.save(modelUrlForRecord(recordId));
    },
    dispose,
  };
}

export async function loadDrawClassifier(
  recordId: string,
  classLabels: UserLabel[],
): Promise<DrawClassifier | null> {
  try {
    const loadedModel = await tf.loadLayersModel(modelUrlForRecord(recordId));
    return createDrawClassifier(loadedModel, classLabels);
  } catch {
    return null;
  }
}

export async function clearSavedModel(recordId: string): Promise<void> {
  const url = modelUrlForRecord(recordId);
  const models = await tf.io.listModels();
  if (url in models) {
    await tf.io.removeModel(url);
  }
}

function softenProbabilities(
  probabilities: Float32Array | Int32Array | Uint8Array,
  temperature: number,
): number[] {
  if (temperature <= 1) {
    return Array.from(probabilities);
  }

  const exponent = 1 / temperature;
  const powered = Array.from(probabilities, (probability) =>
    Math.pow(Math.max(probability, 1e-8), exponent),
  );
  const sum = powered.reduce((total, value) => total + value, 0);
  if (sum <= 0) {
    return Array.from(probabilities);
  }
  return powered.map((value) => value / sum);
}
