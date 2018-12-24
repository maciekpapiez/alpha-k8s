import { Config, getConfig } from './config';
import { AutoscalerModule } from './modules/autoscaler';
import { DashboardModule } from './modules/dashboard';
import { DnsModule } from './modules/dns';
import { CreateAppModule } from './modules/namespace/namespace';
import { createCluster, createKeyPair, getSecret, run } from './utility';

const modules = [
  new DashboardModule(),
  new AutoscalerModule(),
  new DnsModule(),
  new CreateAppModule(),
];

const setupCluster = async (config: Config) => {
  const keyLocation = './cluster_key';
  await createKeyPair(keyLocation, 'admin@' + config.name);

  await createCluster({
    ...config,
    sshPublicKey: keyLocation + '.pub',
  });
};

const install = async (config: Config, moduleNames: string[]) => {
  for (const name of moduleNames) {
    const module = modules.find(m => m.name === name);
    if (!module) {
      throw new Error(`Module "${name}" not found in available modules.`);
    }
    await module.install(config);
  }
};

const runModule = async (config: Config, command: string, args: string[]): Promise<boolean> => {
  const module = modules.find(m => m.name === command);
  if (!module) {
    return false;
  }
  await module.run(config, args);
  return true;
};

const launchDashboard = async () => {
  const adminSecrets = await getSecret('eks-admin');
  console.log(
    'Go to http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/login'
  );
  console.log(`---YOUR TOKEN---\n${adminSecrets.token}\n---YOUR TOKEN---`);
  await run('kubectl proxy');
};

const start = async () => {
  const args = process.argv.slice(2);
  const config = await getConfig('kube.json');

  switch (args[0]) {
    case 'setup':
      await setupCluster(config);
      break;
    case 'dashboard':
      await launchDashboard();
      break;
    case 'install':
    case 'i':
      const modules = args.slice(1);
      await install(config, modules);
      break;
    default:
      const executed = await runModule(config, args[0], args.slice(1));
      if (executed) {
        return;
      }
      console.log(`Kubernetes Helper:
      setup                    - configures cluster
      dashboard                - launches dashboard
      i|install [module names] - applies previously defined "modules" to Kubernetes 
      `);
      break;
  }
};

start()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
