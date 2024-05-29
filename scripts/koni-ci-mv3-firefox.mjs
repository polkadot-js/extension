import fs from 'fs/promises';
import path from 'path';

async function updateManifest() {
  const filePath = path.resolve('./packages/extension-koni/build/manifest.json');

  try {
    // Read the manifest.json file
    const data = await fs.readFile(filePath, 'utf8');
    const manifest = JSON.parse(data);

    // Update the "background" property
    if (manifest.background && manifest.background['service_worker']) {
      manifest.background = {
        scripts: [manifest.background['service_worker']]
      };
    }

    // Write the updated manifest back to the file
    await fs.writeFile(filePath, JSON.stringify(manifest, null, 2));
    console.log('manifest.json has been updated successfully.');
  } catch (error) {
    console.error('Error updating manifest.json:', error);
  }
}

updateManifest();
