import Dexie, { Table } from 'dexie';

export interface SODetail {
  id?: number;
  SO: string;
  TAG: string;
  SKU: string;
  LOCATION: string;
  QUANTITY: number;
  SCAN_SKU?: string;
}

export interface PickedLocation {
  id?: number;
  SO: string;
  LOCATION: string;
  completedAt: Date;
}

export interface ErrorLog {
  id?: number;
  SO: string;
  Location: string;
  Tag?: string;
  SKU?: string;
  ERROR: string;
  Note?: string;
  createdAt: Date;
}

class SOPickingDB extends Dexie {
  soDetails!: Table<SODetail>;
  pickedLocations!: Table<PickedLocation>;
  errors!: Table<ErrorLog>;

  constructor() {
    super('SOPickingDB');
    this.version(1).stores({
      soDetails: '++id,SO,LOCATION',
      pickedLocations: '++id,SO,LOCATION',
      errors: '++id,SO',
    });
  }
}

export const db = new SOPickingDB();
export default db;