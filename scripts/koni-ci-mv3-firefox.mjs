import fs from 'fs/promises';
import path from 'path';

async function updateManifest() {
  const filePath = path.resolve('./packages/extension-koni/build/manifest.json');

  try {
    // Read the manifest.json file
    const data = await fs.readFile(filePath, 'utf8');
    let manifest = JSON.parse(data);

    // Update the "background" property
    if (manifest.background && manifest.background['service_worker']) {
      manifest.background = {
        scripts: [manifest.background['service_worker']]
      };
    }

    if (manifest.content_scripts?.[1]) {
      // Remove the second content script
      manifest.content_scripts.splice(1, 1);
    }

    if (manifest.web_accessible_resources?.[0]) {
      delete manifest.web_accessible_resources[0].use_dynamic_url;
    }
    manifest.permissions.push("activeTab");
    manifest = {...manifest, host_permissions : ["<all_urls>"], optional_permissions : ["activeTab"]};

    if(manifest.content_scripts && manifest.content_scripts.length > 0) {
      manifest.content_scripts[0].js.push("injectGlobal.js");
    }

    // Write the updated manifest back to the file
    await fs.writeFile(filePath, JSON.stringify(manifest, null, 2));
    console.log('manifest.json has been updated successfully.');
  } catch (error) {
    console.error('Error updating manifest.json:', error);
  }
}


updateManifest();
