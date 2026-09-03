import type { RunRecord } from '../logic/ga/types';

/**
 * Persistencia das execucoes do AG em IndexedDB.
 *
 * A serie completa de 1000 geracoes ocupa cerca de 30 KB por execucao, e
 * algumas centenas de execucoes passariam do teto de ~5 MB do localStorage.
 * O IndexedDB nao tem esse limite pratico, e transacional, aceita indices e
 * nao exige nenhuma dependencia nova.
 *
 * Ele NAO funciona sob file://. O pacote ClickAndGo ja serve o app por
 * http://localhost, entao no desktop isto funciona; aberto direto do disco,
 * nao. Toda funcao aqui rejeita com uma mensagem explicita nesse caso, em vez
 * de falhar em silencio.
 */

const DB_NAME = 'nrainhas';
const DB_VERSION = 1;
const STORE = 'runs';

/** Registro persistido: a execucao mais a identidade que o banco atribui. */
export interface StoredRun extends RunRecord {
  id: number;
  createdAt: number;
}

/** O mesmo registro sem a serie temporal, para listar sem carregar tudo. */
export type RunSummary = Omit<StoredRun, 'history'>;

export const INDEXEDDB_UNAVAILABLE =
  'IndexedDB indisponivel. Abra o app por http://localhost (o ClickAndGo ja faz isso) — sob file:// o navegador bloqueia o banco.';

export function isStorageAvailable(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isStorageAvailable()) {
      reject(new Error(INDEXEDDB_UNAVAILABLE));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('n', 'params.n');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(INDEXEDDB_UNAVAILABLE));
  });
}

/** Envolve uma transacao numa promise, fechando o banco no fim. */
function withStore<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export async function saveRun(record: RunRecord): Promise<number> {
  const key = await withStore<IDBValidKey>('readwrite', (store) =>
    store.add({ ...record, createdAt: Date.now() }),
  );
  return Number(key);
}

/**
 * Lista as execucoes da mais recente para a mais antiga, SEM a serie
 * temporal — carregar mil geracoes de cada uma so para desenhar a lista
 * seria desperdicio.
 */
export async function listRuns(): Promise<RunSummary[]> {
  const all = await withStore<StoredRun[]>('readonly', (store) => store.getAll());
  return all
    .map(({ history: _history, ...summary }) => summary)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Uma execucao completa, com a serie, para redesenhar o grafico. */
export async function getRun(id: number): Promise<StoredRun | undefined> {
  return withStore<StoredRun | undefined>('readonly', (store) => store.get(id));
}

export async function deleteRun(id: number): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

export async function clearRuns(): Promise<void> {
  await withStore('readwrite', (store) => store.clear());
}

/** Todo o historico como JSON, para anexar ao relatorio ou versionar. */
export async function exportRuns(): Promise<string> {
  const all = await withStore<StoredRun[]>('readonly', (store) => store.getAll());
  return JSON.stringify({ version: DB_VERSION, exportedAt: Date.now(), runs: all }, null, 2);
}

/**
 * Le um export e acrescenta as execucoes ao banco.
 *
 * Os ids originais sao descartados: importar nao pode sobrescrever execucao
 * que ja esta aqui, e um id de outra maquina nao significa nada nesta.
 */
export async function importRuns(json: string): Promise<number> {
  const parsed: unknown = JSON.parse(json);
  const runs =
    parsed && typeof parsed === 'object' && Array.isArray((parsed as { runs?: unknown }).runs)
      ? ((parsed as { runs: StoredRun[] }).runs)
      : null;

  if (!runs) throw new Error('Arquivo invalido: esperava um objeto com a lista "runs".');

  const db = await openDb();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const run of runs) {
      const { id: _id, ...rest } = run;
      store.add({ ...rest, createdAt: rest.createdAt ?? Date.now() });
    }
    tx.oncomplete = () => {
      db.close();
      resolve(runs.length);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
