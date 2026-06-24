export const useRouter = () => ({
  push: (url: string) => { window.location.href = url; },
  replace: (url: string) => { window.location.href = url; },
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  prefetch: () => {},
  refresh: () => window.location.reload(),
});
export const usePathname = () => window.location.pathname;
export const useSearchParams = () => new URLSearchParams(window.location.search);
export const redirect = (url: string) => { window.location.href = url; };
export const notFound = () => {};

export enum RedirectType {
  push = "push",
  replace = "replace",
}
