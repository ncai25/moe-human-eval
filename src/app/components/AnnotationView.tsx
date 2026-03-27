import { ExplanationPanel } from './ExplanationPanel';
import { ExampleCard } from './ExampleCard';
import { Button } from './ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { Progress } from './ui/progress';

interface Example {
  id: string;
  text: string;
}

interface AnnotationViewProps {
  featureId: string;
  explanation: string;
  question: string;
  examples: Example[];
  answers: Map<string, 'yes' | 'no'>;
  onAnswer: (id: string, label: 'yes' | 'no') => void;
  onBack: () => void;
}

export function AnnotationView({
  featureId,
  explanation,
  question,
  examples,
  answers,
  onAnswer,
  onBack,
}: AnnotationViewProps) {
  const answeredCount = answers.size;
  const totalCount = examples.length;
  const isComplete = answeredCount === totalCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-6 py-8 pb-32">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Expert List
        </Button>

        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{featureId}</span>
            <span className="text-sm text-gray-600">
              {answeredCount} / {totalCount} annotated
            </span>
          </div>
          <Progress value={isComplete ? 100 : 0} className="h-2" />
        </div>

        <ExplanationPanel explanation={explanation} question={question} />

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Examples ({examples.length})
          </h3>

          <div className="grid gap-4">
            {examples.map((example) => (
              <ExampleCard
                key={example.id}
                id={example.id}
                text={example.text}
                answer={answers.get(example.id)}
                onAnswer={onAnswer}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <Button
            onClick={onBack}
            variant={isComplete ? "default" : "outline"}
            className={isComplete ? "w-full bg-green-600 hover:bg-green-700" : "w-full"}
            disabled={!isComplete}
          >
            <ArrowLeft className="size-4 mr-2" />
            {isComplete ? "Complete! Back to List" : `Back to List (${answeredCount}/${totalCount})`}
          </Button>
        </div>
      </div>
    </div>
  );
}