import { loadDrawClassifier, type DrawClassifier } from "../draw/classifier";
import { trainingClassLabels } from "../labels";
import { loadLibrary, type TrainingRecord } from "./trainingLibraryStore";
import type { DrawTopic } from "../drawBank";

export type LoadedTopicClassifier = {
  topic: DrawTopic;
  record: TrainingRecord;
  classifier: DrawClassifier;
};

export async function loadAllTrainedClassifiers(): Promise<
  LoadedTopicClassifier[]
> {
  const library = loadLibrary();
  const loaded: LoadedTopicClassifier[] = [];

  for (const record of library.records) {
    const classifier = await loadDrawClassifier(
      record.id,
      trainingClassLabels(record.targetLabel),
    );
    if (!classifier) {
      continue;
    }
    loaded.push({
      topic: record.targetLabel,
      record,
      classifier,
    });
  }

  return loaded;
}
