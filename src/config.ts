import * as fs from 'fs';
import { isNil } from 'lodash';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export interface Config {
  name: string;
  region: string;
  nodesMin: number;
  nodesMax: number;
  domain?: string;
  modules?: string[];
}

export const getConfig = async (configPath: string): Promise<Config> => {
  const config = JSON.parse(await readFile(configPath, { encoding: 'utf8' }));

  const requireField = (name: string) => {
    if (isNil(config[name])) {
      throw new Error(`Config is missing required field "${name}"`);
    }
  };

  requireField('name');
  requireField('region');
  requireField('nodesMin');
  requireField('nodesMax');
  if (!config.modules) {
    config.modules = [];
  }

  return config;
};