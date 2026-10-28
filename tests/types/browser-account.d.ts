/** Browser-loaded legacy account client surface used by UI tests. */
export const account: {
  request(path: string, options?: RequestInit): Promise<any>;
};
