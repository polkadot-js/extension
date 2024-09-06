// Copyright 2019-2024 @polkadot/extension authors & contributors, modified by bagpipes



const api_endpoint = "";

/*
// json blob parse
interface ActionParameter {
    name: string;
    label: string;
  }
  
  interface Action {
    label: string;
    href: string;
    parameters?: ActionParameter[];
  }
  
  interface Links {
    actions: Action[];
  }
  
  interface LinkInfo {
    icon: string;
    title: string;
    description: string;
    label: string;
    links: Links;
  }

*/

export function download_metadata(link_token: string) {
    const out = fetch(`${api_endpoint}/${link_token}`); //: LinkInfo

    return out;
}


export function html_base(logo: string, title: string){ //inputen: string
    const image = `<img src="${logo}">`;
    const full_body = `<div>
${image}<br>
<h4>${title}</h4>
    </div>`;


    return full_body;
}