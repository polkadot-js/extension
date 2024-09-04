// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0


// THE LINK REGEX
const regexPattern2 = /polkadotlink:\/\/[A-Za-z0-9]{46}/g; // Note the 'g' flag for global matching

//var regex_links = "polkadotlink\:\/\/[A-Z-a-z-0-9]{46}"

// import { chrome } from '@polkadot/extension-inject/chrome';
/// polkadotlink://QmPLVqWgEoNBjyTPBKw5prq6uuU1id2Wr39QWmpmyafEpF ipfs test
// $ polkadotlink://QmRUxiaLQj8MtZeM6uiLiRMR3fyLeFcMzSrCq8NGtPPzZW


export function replaceLinksInTextNodes(node: Node) {
    console.log(`replaceLinksInTextNodes called`);
    console.log(`node type is: `, node.nodeType);
    console.log(`node object: `, node);
    console.log(`node text object: `, node?.textContent);
  if (node.nodeType === Node.TEXT_NODE) {
    // Type assertion to ensure node is of type Text
    const textNode = node as Text;
    // Replace text in text nodes
    console.log(`replace strings `);
    textNode.textContent = textNode.textContent?.replace(regexPattern2, match => {
      // Process each matched link
      console.log(`Found match: ${match}`);
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