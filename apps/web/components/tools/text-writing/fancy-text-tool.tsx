"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Copy, MagicWand, CheckCircle } from "@phosphor-icons/react"
import { Input } from "@workspace/ui/components/input"

const NORMAL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const STYLES = [
  {
    name: "Bold",
    chars: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵"
  },
  {
    name: "Italic",
    // Note: 'h' is left out of normal italic block in unicode technically (Planck constant), but we map visually closest if needed.
    chars: "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789"
  },
  {
    name: "Bold Italic",
    chars: "𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯0123456789"
  },
  {
    name: "Monospace",
    chars: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿"
  },
  {
    name: "Script",
    // Standard unicode holes are approximated here with visually similar or exact chars
    chars: "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏0123456789"
  },
  {
    name: "Fraktur",
    chars: "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷0123456789"
  },
  {
    name: "Double Struck",
    chars: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡"
  },
  {
    name: "Wide (Vaporwave)",
    chars: "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９"
  },
  {
    name: "Circled",
    chars: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ⓪①②③④⑤⑥⑦⑧⑨"
  },
  {
    name: "Squared",
    chars: "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩0123456789"
  }
];

function applyStyle(text: string, styleChars: string): string {
  // Convert standard string to array of characters (supports surrogate pairs natively by doing a split on empty string? No, standard split doesn't handle surrogates well but NORMAL_CHARS are single JS chars).
  // styleChars must be split by surrogate pairs to index correctly!
  const targetChars = Array.from(styleChars);
  
  return text.split('').map(char => {
    const index = NORMAL_CHARS.indexOf(char);
    if (index !== -1 && targetChars[index]) {
      return targetChars[index];
    }
    return char;
  }).join('');
}

export function FancyTextTool() {
  const [input, setInput] = React.useState("Hello Kraaft! 123");
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagicWand className="text-primary" /> Fancy Text Styler
          </CardTitle>
          <CardDescription>Convert regular text into stylish Unicode fonts for social media.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Textarea 
              placeholder="Type your text here..." 
              className="min-h-[120px] text-lg"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STYLES.map((style, index) => {
              const output = applyStyle(input, style.chars);
              const isCopied = copiedIndex === index;
              
              return (
                <Card key={style.name} className="overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
                  <div className="bg-muted/30 px-3 py-2 border-b flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {style.name}
                  </div>
                  <div className="p-3 relative group">
                    <div className="pr-12 text-sm break-all font-medium min-h-[40px] flex items-center">
                      {output || <span className="text-muted-foreground/30">Preview...</span>}
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${isCopied ? 'opacity-100 text-green-500 hover:text-green-600' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={() => handleCopy(output, index)}
                      disabled={!output}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <CheckCircle weight="fill" /> : <Copy />}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
