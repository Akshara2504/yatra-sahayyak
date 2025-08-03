import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Language } from "@/lib/translations";

interface LanguageSelectorProps {
  value: Language;
  onValueChange: (value: Language) => void;
}

const languages = [
  { code: 'english' as Language, name: 'English', native: 'English' },
  { code: 'hindi' as Language, name: 'Hindi', native: 'हिंदी' },
  { code: 'telugu' as Language, name: 'Telugu', native: 'తెలుగు' },
];

export const LanguageSelector = ({ value, onValueChange }: LanguageSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Language" />
      </SelectTrigger>
      <SelectContent className="bg-popover">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.native} ({lang.name})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};