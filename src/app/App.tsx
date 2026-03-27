import { useState } from 'react';
import { ExpertListView } from './components/ExpertListView';
import { AnnotationView } from './components/AnnotationView';
import { Download } from 'lucide-react';
import { Button } from './components/ui/button';
import exampleData from '../imports/example.json';

interface Example {
  id: string;
  text: string;
}

interface Expert {
  expert_id: string;
  expert_explanation: string;
  examples: Example[];
}

interface ExpertAnnotations {
  [expertIndex: number]: Map<string, 'yes' | 'no'>;
}

// Mock data: number of people who have completed each expert
const MOCK_COMPLETION_COUNTS: { [expertIndex: number]: number } = {
  0: 3,  // expert 1 has 3 completions
  1: 2,  // expert 2 has 2 completions
  4: 1,  // expert 5 has 1 completion
  7: 4,  // expert 8 has 4 completions
  // other experts have 0 completions
};

// Sample data with 36 experts
const INITIAL_DATA: Expert[] = Array.from({ length: 36 }, (_, i) => {
  // Use real data for expert 1
  if (i === 0 && exampleData.length > 0) {
    const firstExpert = exampleData[0];
    return {
      expert_id: `expert_${i + 1}`,
      expert_explanation: firstExpert.explanation,
      examples: firstExpert.examples.map((ex) => ({
        id: String(ex.id),
        text: ex.text,
      })),
    };
  }
  
  // Placeholder data for other experts
  return {
    expert_id: `expert_${i + 1}`,
    expert_explanation: `This is the expert explanation for expert ${i + 1}. It describes the specific pattern or behavior this feature detects.`,
    examples: Array.from({ length: 5 }, (_, j) => ({
      id: `ex_${i + 1}_${j + 1}`,
      text: `This is example ${j + 1} for expert ${i + 1}. It demonstrates the feature being analyzed.`,
    })),
  };
});

export default function App() {
  const [experts, setExperts] = useState<Expert[]>(INITIAL_DATA);
  const [selectedExpertIndex, setSelectedExpertIndex] = useState<number | null>(null);
  const [allAnnotations, setAllAnnotations] = useState<ExpertAnnotations>({});
  const [annotatorId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);

  const handleAnswer = (id: string, label: 'yes' | 'no') => {
    if (selectedExpertIndex === null) return;
    
    const currentAnnotations = allAnnotations[selectedExpertIndex] || new Map();
    const updatedAnnotations = new Map(currentAnnotations);
    updatedAnnotations.set(id, label);
    
    setAllAnnotations({
      ...allAnnotations,
      [selectedExpertIndex]: updatedAnnotations,
    });
  };

  const handleExportCurrent = () => {
    if (selectedExpertIndex === null) return;

    const expert = experts[selectedExpertIndex];
    const answers = allAnnotations[selectedExpertIndex] || new Map();

    const output = {
      expert_id: expert.expert_id,
      annotator_id: annotatorId,
      answers: expert.examples.map((example) => ({
        id: example.id,
        label: answers.get(example.id) || null,
      })),
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${expert.expert_id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Go back to list after export
    setSelectedExpertIndex(null);
  };

  const handleExportAll = () => {
    const allOutputs = experts
      .map((expert, index) => {
        const answers = allAnnotations[index] || new Map();
        return {
          expert_id: expert.expert_id,
          annotator_id: annotatorId,
          answers: expert.examples.map((example) => ({
            id: example.id,
            label: answers.get(example.id) || null,
          })),
        };
      })
      .filter((output) => output.answers.some((a) => a.label !== null)); // Only export experts with at least one answer

    const blob = new Blob([JSON.stringify(allOutputs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_annotations_${annotatorId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check which experts are completed
  const completedExperts = new Set<number>();
  experts.forEach((expert, index) => {
    const answers = allAnnotations[index];
    if (answers && answers.size === expert.examples.length) {
      completedExperts.add(index);
    }
  });

  // Show annotation view if an expert is selected
  if (selectedExpertIndex !== null) {
    const expert = experts[selectedExpertIndex];
    const answers = allAnnotations[selectedExpertIndex] || new Map();

    return (
      <AnnotationView
        featureId={expert.expert_id}
        explanation={expert.expert_explanation}
        question="Does this text exhibit the characteristics described in the expert explanation?"
        examples={expert.examples}
        answers={answers}
        onAnswer={handleAnswer}
        onBack={() => setSelectedExpertIndex(null)}
      />
    );
  }

  // Show expert list view
  return (
    <div className="min-h-screen bg-gray-50">
      <ExpertListView
        experts={experts}
        onSelectExpert={setSelectedExpertIndex}
        completedExperts={completedExperts}
      />

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <Button
            onClick={handleExportAll}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={completedExperts.size === 0}
          >
            <Download className="size-4 mr-2" />
            Export My Annotations ({completedExperts.size} completed)
          </Button>
        </div>
      </div>

      <div className="h-20" /> {/* Spacer for fixed bottom bar */}
    </div>
  );
}