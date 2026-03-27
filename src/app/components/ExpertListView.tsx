import { ChevronRight, CheckCircle2, Circle } from 'lucide-react';

interface Expert {
  expert_id: string;
  expert_explanation: string;
  examples: Array<{ id: string; text: string }>;
}

interface ExpertListViewProps {
  experts: Expert[];
  onSelectExpert: (index: number) => void;
  completedExperts: Set<number>;
  completionCounts: { [key: number]: number };
}

export function ExpertListView({ experts, onSelectExpert, completedExperts }: ExpertListViewProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Expert Features</h1>
          <p className="text-gray-600">
            Select an expert feature to annotate examples
          </p>
        </div>

        <div className="grid gap-3">
          {experts.map((expert, index) => {
            const isCompleted = completedExperts.has(index);
            
            return (
              <button
                key={expert.expert_id}
                onClick={() => onSelectExpert(index)}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="size-5 text-green-600" />
                    ) : (
                      <Circle className="size-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      Expert {index + 1}
                    </h3>
                  </div>

                  <ChevronRight className="size-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}