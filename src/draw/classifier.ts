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

      const featureSize = examples[0].features.length;
      const features = tf.tensor2d(examples.map((example) => example.features));

      let labels = tf.oneHot(
        tf.tensor1d(
          examples.map((example) => labelToIndex[example.label]),
          "int32",
        ),
        nextClassLabels.length,
      ) as tf.Tensor2D;

      if (LABEL_SMOOTHING > 0) {
        const smoothed = labels
          .mul(1 - LABEL_SMOOTHING)
          .add(LABEL_SMOOTHING / nextClassLabels.length) as tf.Tensor2D;
        labels.dispose();
        labels = smoothed;
      }

      model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [featureSize],
            units: HIDDEN_UNITS,
            activation: "relu",
          }),
          tf.layers.dropout({ rate: DROPOUT_RATE }),
          tf.layers.dense({
            units: nextClassLabels.length,
            activation: "softmax",
          }),
        ],
      });

      model.compile({
        optimizer: tf.train.adam(0.008),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
      });

      const history = await model.fit(features, labels, {
        epochs: TRAINING_EPOCHS,
        shuffle: true,
        batchSize: Math.min(16, examples.length),
      });

      features.dispose();
      labels.dispose();

      const accuracySeries = history.history.accuracy ??
        history.history.acc ?? [0];
      const lastIndex = accuracySeries.length - 1;

      return {
        accuracy: Number(accuracySeries[lastIndex] ?? 0),
      };
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
