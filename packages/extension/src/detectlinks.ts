// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0


// THE LINK REGEX
var regex_links = "polkadotlink\:\/\/[A-Z-a-z-0-9]{46}"

// import { chrome } from '@polkadot/extension-inject/chrome';
/// polkadotlink://QmPLVqWgEoNBjyTPBKw5prq6uuU1id2Wr39QWmpmyafEpF ipfs test
// $ polkadotlink://QmRUxiaLQj8MtZeM6uiLiRMR3fyLeFcMzSrCq8NGtPPzZW


export function replaceLinksInTextNodes(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    // Type assertion to ensure node is of type Text
    const textNode = node as Text;
    // Replace text in text nodes
    textNode.textContent = textNode.textContent?.replace(regex_links, match => {
      // Process each matched link
      return get_link_data(match);
    }) ?? '';
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Iterate through child nodes
    node.childNodes.forEach(replaceLinksInTextNodes);
  }
}

// Function to get data from the link
function get_link_data(link: string): string {
  const link_result = link;
  return `<h3>Link detected: ${link_result}</h3>`;
}