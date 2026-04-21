declare module "emoji-dictionary" {
  const emoji: {
    getName: (char: string) => string | undefined;
    getUnicode: (name: string) => string | undefined;
  };
  export default emoji;
}

declare module "figlet" {
  export interface Options {
    font?: string;
    horizontalLayout?: "default" | "full" | "fitted" | "controlled horizontal scrolling" | "universal horizontal scrolling";
    verticalLayout?: "default" | "full" | "fitted" | "controlled vertical scrolling" | "universal vertical scrolling";
    width?: number;
    whitespaceBreak?: boolean;
  }
  export function text(
    text: string,
    options: Options,
    cb: (error: Error | null, result: string | undefined) => void
  ): void;
  export function parseFont(name: string, data: string): void;
  export default {
    text,
    parseFont,
  };
}

declare module "syllable" {
  export function syllable(text: string): number;
}

declare module "figlet/importable-fonts/*" {
  const content: string;
  export default content;
}
