import { Config } from './config';

export abstract class Module {
  protected constructor(
    public readonly name: string
  ) {
  }

  public async install(_config: Config): Promise<void> {
    throw new Error('Install not implemented');
  }

  public async run(_config: Config, _args: string[]): Promise<void> {
    throw new Error('Run not implemented');
  }
}