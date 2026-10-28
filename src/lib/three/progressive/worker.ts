import { buildModel } from "./factory";
import { packModel } from "./pack";
import type { WorkerRequest, WorkerResponse } from "./types";

const worker = globalThis as unknown as {
    onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
    postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

worker.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const report = (value: number, stage: string) => {
        const message: WorkerResponse = { type: "progress", value, stage };
        worker.postMessage(message);
    };
    try {
        report(2, "生成模型");
        const model = buildModel(event.data.mode, event.data.quality, report);
        report(54, "整理几何");
        const packed = packModel(model, report);
        const message: WorkerResponse = { type: "model", data: packed.data };
        worker.postMessage(message, packed.transfers);
    } catch (error) {
        const failure = error instanceof Error ? error : new Error(String(error));
        const message: WorkerResponse = {
            type: "error",
            message: failure.message,
            stack: failure.stack
        };
        worker.postMessage(message);
    }
};
