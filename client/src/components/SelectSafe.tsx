// ZERO HARDCODING COMPLIANCE - Safe Select Wrapper
// Prevents empty string values from ever reaching Select components
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SENTINEL } from "@/constants/sentinels";

type Option = { label: string; value: string }; // value must be non-empty
type Props = {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: Option[];
  placeholder?: string;
  allowAll?: boolean;
  allValue?: string;   // default SENTINEL.ALL_STATUS or similar
  allLabel?: string;   // default "All"
  disabled?: boolean;
  className?: string;
};

export default function SelectSafe({
  value,
  onChange,
  options,
  placeholder = "Select…",
  allowAll = false,
  allValue = SENTINEL.ALL_STATUS,
  allLabel = "All",
  disabled = false,
  className = "",
}: Props) {
  const val = value ?? SENTINEL.NONE;

  const handle = (v: string) => {
    if (v === SENTINEL.NONE) onChange(undefined);
    else onChange(v);
  };

  return (
    <Select value={val} onValueChange={handle} disabled={disabled}>
      <SelectTrigger className={className} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SENTINEL.NONE} disabled>{placeholder}</SelectItem>
        {allowAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}