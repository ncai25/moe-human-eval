import { Check, X } from 'lucide-react';
import { Button } from './ui/button';

interface ExampleCardProps {
  id: string;
  text: string;
  answer?: 'yes' | 'no';
  onAnswer: (id: string, label: 'yes' | 'no') => void;
}

export function ExampleCard({ id, text, answer, onAnswer }: ExampleCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-gray-800 mb-4 leading-relaxed">{text}</p>
      
      <div className="flex gap-3">
        <Button
          onClick={() => onAnswer(id, 'yes')}
          variant={answer === 'yes' ? 'default' : 'outline'}
          className={`flex-1 ${
            answer === 'yes'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'hover:bg-green-50 hover:border-green-300'
          }`}
        >
          <Check className="size-4 mr-2" />
          Yes
        </Button>
        
        <Button
          onClick={() => onAnswer(id, 'no')}
          variant={answer === 'no' ? 'default' : 'outline'}
          className={`flex-1 ${
            answer === 'no'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'hover:bg-red-50 hover:border-red-300'
          }`}
        >
          <X className="size-4 mr-2" />
          No
        </Button>
      </div>
    </div>
  );
}
