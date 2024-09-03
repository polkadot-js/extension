import { chrome } from '@polkadot/extension-inject/chrome';


/// polkadotlink://QmPLVqWgEoNBjyTPBKw5prq6uuU1id2Wr39QWmpmyafEpF
// $ polkadotlink://QmRUxiaLQj8MtZeM6uiLiRMR3fyLeFcMzSrCq8NGtPPzZW

var regex_links = "polkadotlink\:\/\/[A-Z-a-z-0-9]{46}"

function replaceLinksInTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Replace text in text nodes
      node.textContent = node.textContent.replace(regex_links, match => {
        // Process each matched link
        return get_link_data(match);
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Iterate through child nodes
      node.childNodes.forEach(replaceLinksInTextNodes);
    }
  }
  

function get_link_data(link){
    return "<h3>Link detected</h3>"
}

