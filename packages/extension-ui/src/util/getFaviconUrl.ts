export async function getFaviconUrl(url: string): Promise<string> {
  const defaultPath = '/favicon.ico';
  const { origin } = new URL(url);
  const defaultReturnURL = `${origin}${defaultPath}`;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const faviconLink =
      (doc.querySelector('link[rel="icon"]') as HTMLLinkElement) ||
      (doc.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement);

    if (faviconLink) {
      const faviconUrl = new URL(faviconLink.href, url);
      const faviconPath = faviconUrl.pathname;

      return `${origin}${faviconPath}`;
    }
  } catch (err) {
    console.error('Error fetching favicon URL:', err);
  }

  return defaultReturnURL;
}
