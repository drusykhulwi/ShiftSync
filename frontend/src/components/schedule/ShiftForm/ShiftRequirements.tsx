// frontend/src/components/schedule/ShiftForm/ShiftRequirements.tsx
import React from 'react';
import { Button } from '../../common/Button';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Requirement {
  skillId: string;
  headcount: number;
  priority?: number; // Make priority optional
}

interface ShiftRequirementsProps {
  requirements: Requirement[];
  skills: Skill[];
  onChange: (requirements: Requirement[]) => void;
}

export const ShiftRequirements: React.FC<ShiftRequirementsProps> = ({
  requirements,
  skills,
  onChange,
}) => {
  const addRequirement = () => {
    onChange([
      ...requirements,
      { skillId: '', headcount: 1, priority: 0 },
    ]);
  };

  const removeRequirement = (index: number) => {
    onChange(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, field: keyof Requirement, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const skillOptions = skills.map(skill => ({
    value: skill.id,
    label: `${skill.name} (${skill.category})`,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Shift Requirements</h4>
        <Button type="button" size="sm" onClick={addRequirement}>
          + Add Requirement
        </Button>
      </div>

      {requirements.map((req, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <Select
              value={skillOptions.find(opt => opt.value === req.skillId) || null}
              onChange={(opt) => updateRequirement(index, 'skillId', opt?.value)}
              options={skillOptions}
              placeholder="Select skill"
            />
          </div>
          <div className="w-24">
            <Input
              type="number"
              min="1"
              value={req.headcount}
              onChange={(e) => updateRequirement(index, 'headcount', parseInt(e.target.value))}
              placeholder="Count"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRequirement(index)}
            className="mt-2 text-red-500 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}

      {requirements.length === 0 && (
        <p className="text-sm text-gray-500 italic">No requirements added yet</p>
      )}
    </div>
  );
};