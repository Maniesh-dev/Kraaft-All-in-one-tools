"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"
import { BookOpen, Exam, BookmarkSimple } from "@phosphor-icons/react"


function countSyllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');
  const syllables = w.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function ReadabilityScorerTool() {
  const [text, setText] = React.useState("")

  const metrics = React.useMemo(() => {
    if (!text.trim()) {
      return { words: 0, sentences: 0, syllables: 0, fkScore: 0, fkGrade: 0, level: "-" }
    }

    const sentencesMatch = text.match(/[^.!?\n]+[.!?\n]*/g) || [];
    const sentences = sentencesMatch.filter(s => s.trim().length > 0).length || 1;

    const wordsArray = text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z0-9]/g, '').length > 0);
    const words = wordsArray.length || 1; // Prevent division by zero

    let syllables = 0;
    wordsArray.forEach(w => syllables += countSyllables(w));
    if (syllables === 0) syllables = 1;

    // Flesch Reading Ease
    // 206.835 - 1.015(Total Words / Total Sentences) - 84.6(Total Syllables / Total Words)
    let fkScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    fkScore = Math.max(0, Math.min(100, Math.round(fkScore)));

    // Flesch-Kincaid Grade Level
    // 0.39(Total Words / Total Sentences) + 11.8(Total Syllables / Total Words) - 15.59
    let fkGrade = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59;
    fkGrade = Math.max(0, Math.round(fkGrade * 10) / 10);

    let level = "Professional";
    if (fkScore >= 90) level = "Very Easy (5th Grade)";
    else if (fkScore >= 80) level = "Easy (6th Grade)";
    else if (fkScore >= 70) level = "Fairly Easy (7th Grade)";
    else if (fkScore >= 60) level = "Plain English (8th-9th Grade)";
    else if (fkScore >= 50) level = "Fairly Difficult (10th-12th Grade)";
    else if (fkScore >= 30) level = "Difficult (College)";
    else level = "Very Difficult (College Graduate)";

    if (wordsArray.length === 0) {
      return { words: 0, sentences: 0, syllables: 0, fkScore: 0, fkGrade: 0, level: "-" };
    }

    return { words, sentences, syllables, fkScore, fkGrade, level };

  }, [text])

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="text-primary" /> Readability Scorer
          </CardTitle>
          <CardDescription>Calculate reading ease and grade level of your text.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea 
            placeholder="Paste your article or passage here..." 
            className="min-h-[200px] text-base resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Realtime Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="border bg-muted/20 rounded-xl p-4 text-center flex flex-col justify-center shadow-sm">
                 <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Words</span>
                 <span className="text-2xl font-bold">{metrics.words}</span>
              </div>
              <div className="border bg-muted/20 rounded-xl p-4 text-center flex flex-col justify-center shadow-sm">
                 <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Sentences</span>
                 <span className="text-2xl font-bold">{metrics.sentences}</span>
              </div>
              <div className="border bg-muted/20 rounded-xl p-4 text-center flex flex-col justify-center shadow-sm">
                 <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Syllables</span>
                 <span className="text-2xl font-bold">{metrics.syllables}</span>
              </div>
            </div>

            {/* Flesch-Kincaid */}
            <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-end mb-2 relative z-10">
                   <div>
                      <p className="text-sm font-semibold flex items-center gap-1"><Exam className="text-green-600" /> Reading Ease Score</p>
                      <p className="text-xs text-muted-foreground">Flesch-Kincaid Scale</p>
                   </div>
                   <div className="text-3xl font-black text-green-600 dark:text-green-400">
                      {metrics.fkScore}
                   </div>
                </div>
                <div className="h-2 w-full mb-3 bg-green-500/20 rounded-full overflow-hidden relative">
                   <div className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${metrics.fkScore}%` }} />
                </div>
                <div className="flex items-center gap-2 relative z-10">
                   <BookmarkSimple className="text-muted-foreground size-4" />
                   <span className="text-sm font-medium">{metrics.level}</span>
                </div>
                {/* Background Decoration */}
                <div className="absolute -right-6 -bottom-8 opacity-[0.03] z-0">
                  <Exam size={140} weight="fill" />
                </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-500/10 text-blue-800 dark:text-blue-300 p-4 flex gap-4 text-sm mt-4">
             <div>
                <strong>Grade Level: {metrics.fkGrade > 0 ? metrics.fkGrade : '-'}</strong>
                <p className="opacity-80 mt-1">This roughly translates to the US school grade level required to understand the text. For most public audiences, aim for a grade level around 8.0.</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
