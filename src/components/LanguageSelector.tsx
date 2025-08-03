import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const languages = [
  { code: 'english', name: 'English', native: 'English' },
  { code: 'hindi', name: 'Hindi', native: 'हिंदी' },
  { code: 'telugu', name: 'Telugu', native: 'తెలుగు' },
];

export const LanguageSelector = ({ value, onValueChange }: LanguageSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.native} ({lang.name})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};