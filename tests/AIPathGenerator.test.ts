import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV, principalCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_PATH_ID = 101;
const ERR_INVALID_MODULE_COUNT = 102;
const ERR_INVALID_METADATA = 103;
const ERR_PATH_ALREADY_EXISTS = 104;
const ERR_PATH_NOT_FOUND = 105;
const ERR_INVALID_DIFFICULTY = 106;
const ERR_INVALID_DURATION = 107;
const ERR_INVALID_UPDATE_TIMESTAMP = 108;
const ERR_INVALID_ORACLE = 109;
const ERR_MAX_PATHS_EXCEEDED = 110;
const ERR_INVALID_USER = 111;
const ERR_INVALID_MODULE_ID = 112;

interface LearningPath {
  modules: number[];
  metadata: string;
  difficulty: number;
  estimatedDuration: number;
  timestamp: number;
  status: boolean;
}

interface PathUpdate {
  updatedModules: number[];
  updatedMetadata: string;
  updatedDifficulty: number;
  updatedDuration: number;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class AIPathGeneratorMock {
  state: {
    nextPathId: number;
    maxPaths: number;
    oraclePrincipal: string | null;
    learningPaths: Map<string, LearningPath>;
    pathUpdates: Map<string, PathUpdate>;
  } = {
    nextPathId: 0,
    maxPaths: 10000,
    oraclePrincipal: null,
    learningPaths: new Map(),
    pathUpdates: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";

  reset(): void {
    this.state = {
      nextPathId: 0,
      maxPaths: 10000,
      oraclePrincipal: null,
      learningPaths: new Map(),
      pathUpdates: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
  }

  setOracle(oracle: string): Result<boolean> {
    if (this.caller !== this.caller) return { ok: false, value: false };
    if (this.state.oraclePrincipal !== null) return { ok: false, value: false };
    this.state.oraclePrincipal = oracle;
    return { ok: true, value: true };
  }

  storePath(user: string, modules: number[], metadata: string, difficulty: number, estimatedDuration: number): Result<number> {
    const pathId = this.state.nextPathId;
    const key = `${user}:${pathId}`;
    if (this.state.nextPathId >= this.state.maxPaths) return { ok: false, value: ERR_MAX_PATHS_EXCEEDED };
    if (!this.state.oraclePrincipal || this.caller !== this.state.oraclePrincipal) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (user === "SP000000000000000000002Q6VF78") return { ok: false, value: ERR_INVALID_USER };
    if (modules.length === 0 || modules.length > 50) return { ok: false, value: ERR_INVALID_MODULE_COUNT };
    if (modules.some(id => id <= 0)) return { ok: false, value: ERR_INVALID_MODULE_ID };
    if (metadata.length > 256) return { ok: false, value: ERR_INVALID_METADATA };
    if (difficulty < 1 || difficulty > 10) return { ok: false, value: ERR_INVALID_DIFFICULTY };
    if (estimatedDuration <= 0) return { ok: false, value: ERR_INVALID_DURATION };
    if (this.state.learningPaths.has(key)) return { ok: false, value: ERR_PATH_ALREADY_EXISTS };
    this.state.learningPaths.set(key, {
      modules,
      metadata,
      difficulty,
      estimatedDuration,
      timestamp: this.blockHeight,
      status: true,
    });
    this.state.nextPathId++;
    return { ok: true, value: pathId };
  }

  updatePath(user: string, pathId: number, modules: number[], metadata: string, difficulty: number, estimatedDuration: number): Result<boolean> {
    const key = `${user}:${pathId}`;
    const path = this.state.learningPaths.get(key);
    if (!path) return { ok: false, value: false };
    if (!this.state.oraclePrincipal || this.caller !== this.state.oraclePrincipal) return { ok: false, value: false };
    if (user === "SP000000000000000000002Q6VF78") return { ok: false, value: false };
    if (modules.length === 0 || modules.length > 50) return { ok: false, value: false };
    if (modules.some(id => id <= 0)) return { ok: false, value: false };
    if (metadata.length > 256) return { ok: false, value: false };
    if (difficulty < 1 || difficulty > 10) return { ok: false, value: false };
    if (estimatedDuration <= 0) return { ok: false, value: false };
    this.state.learningPaths.set(key, {
      modules,
      metadata,
      difficulty,
      estimatedDuration,
      timestamp: this.blockHeight,
      status: path.status,
    });
    this.state.pathUpdates.set(key, {
      updatedModules: modules,
      updatedMetadata: metadata,
      updatedDifficulty: difficulty,
      updatedDuration: estimatedDuration,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  deactivatePath(user: string, pathId: number): Result<boolean> {
    const key = `${user}:${pathId}`;
    const path = this.state.learningPaths.get(key);
    if (!path) return { ok: false, value: false };
    if (!this.state.oraclePrincipal || this.caller !== this.state.oraclePrincipal) return { ok: false, value: false };
    this.state.learningPaths.set(key, { ...path, status: false });
    return { ok: true, value: true };
  }

  getPath(user: string, pathId: number): LearningPath | null {
    return this.state.learningPaths.get(`${user}:${pathId}`) || null;
  }

  getPathUpdate(user: string, pathId: number): PathUpdate | null {
    return this.state.pathUpdates.get(`${user}:${pathId}`) || null;
  }

  getPathCount(): Result<number> {
    return { ok: true, value: this.state.nextPathId };
  }
}

describe("AIPathGenerator", () => {
  let contract: AIPathGeneratorMock;

  beforeEach(() => {
    contract = new AIPathGeneratorMock();
    contract.reset();
  });

  it("stores a path successfully", () => {
    contract.setOracle("ST1TEST");
    const result = contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const path = contract.getPath("ST2USER", 0);
    expect(path?.modules).toEqual([1, 2, 3]);
    expect(path?.metadata).toBe("Learn Web3 Basics");
    expect(path?.difficulty).toBe(5);
    expect(path?.estimatedDuration).toBe(3600);
    expect(path?.status).toBe(true);
  });

  it("rejects path storage by non-oracle caller", () => {
    contract.setOracle("ST3ORACLE");
    contract.caller = "ST4FAKE";
    const result = contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects path with invalid user", () => {
    contract.setOracle("ST1TEST");
    const result = contract.storePath("SP000000000000000000002Q6VF78", [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_USER);
  });

  it("rejects path with invalid module count", () => {
    contract.setOracle("ST1TEST");
    const result = contract.storePath("ST2USER", [], "Learn Web3 Basics", 5, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MODULE_COUNT);
  });

  it("rejects path with invalid module ID", () => {
    contract.setOracle("ST1TEST");
    const result = contract.storePath("ST2USER", [1, 0, 3], "Learn Web3 Basics", 5, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_MODULE_ID);
  });

  it("rejects path with invalid metadata", () => {
    contract.setOracle("ST1TEST");
    const longMetadata = "x".repeat(257);
    const result = contract.storePath("ST2USER", [1, 2, 3], longMetadata, 5, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_METADATA);
  });

  it("rejects path with invalid difficulty", () => {
    contract.setOracle("ST1TEST");
    const result = contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 11, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_DIFFICULTY);
  });

  it("rejects path with invalid duration", () => {
    contract.setOracle("ST1TEST");
    const result = contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 5, 0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_DURATION);
  });

  it("updates a path successfully", () => {
    contract.setOracle("ST1TEST");
    contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    const result = contract.updatePath("ST2USER", 0, [4, 5, 6], "Advanced Web3", 7, 7200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const path = contract.getPath("ST2USER", 0);
    expect(path?.modules).toEqual([4, 5, 6]);
    expect(path?.metadata).toBe("Advanced Web3");
    expect(path?.difficulty).toBe(7);
    expect(path?.estimatedDuration).toBe(7200);
    const update = contract.getPathUpdate("ST2USER", 0);
    expect(update?.updatedModules).toEqual([4, 5, 6]);
    expect(update?.updatedMetadata).toBe("Advanced Web3");
    expect(update?.updatedDifficulty).toBe(7);
    expect(update?.updatedDuration).toBe(7200);
  });

  it("rejects update for non-existent path", () => {
    contract.setOracle("ST1TEST");
    const result = contract.updatePath("ST2USER", 99, [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("deactivates a path successfully", () => {
    contract.setOracle("ST1TEST");
    contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    const result = contract.deactivatePath("ST2USER", 0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const path = contract.getPath("ST2USER", 0);
    expect(path?.status).toBe(false);
  });

  it("rejects deactivation for non-existent path", () => {
    contract.setOracle("ST1TEST");
    const result = contract.deactivatePath("ST2USER", 99);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("returns correct path count", () => {
    contract.setOracle("ST1TEST");
    contract.storePath("ST2USER", [1, 2, 3], "Learn Web3 Basics", 5, 3600);
    contract.storePath("ST3USER", [4, 5, 6], "Learn Blockchain", 6, 7200);
    const result = contract.getPathCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });
});