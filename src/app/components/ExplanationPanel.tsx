import { AlertCircle } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: string;
  question: string;
}

export function ExplanationPanel({ explanation, question }: ExplanationPanelProps) {
  return (
    <div className="space-y-4 mb-8">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-blue-900 mb-2">Expert Explanation</h2>
            <p className="text-blue-800">{explanation}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-300 p-5 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-1">Annotation Question</h3>
        <p className="text-gray-700">{question}</p>
      </div>
    </div>
  );
}
