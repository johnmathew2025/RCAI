import csv

# Read the original CSV and fix the duplicate equipment code
input_file = "attached_assets/Updated_RCA_Library1_1753170048723.csv"
output_file = "/tmp/corrected_library.csv"

with open(input_file, 'r', encoding='utf-8') as infile:
    lines = infile.readlines()

# Fix line 100 (index 99) to change PMP-CEN-006 to PMP-CEN-099
for i, line in enumerate(lines):
    if i == 99:  # Line 100 (0-indexed)
        # Replace the equipment code and failure code
        lines[i] = line.replace('PMP-CEN-006,F-006', 'PMP-CEN-099,F-099')
        break

# Write the corrected CSV
with open(output_file, 'w', encoding='utf-8') as outfile:
    outfile.writelines(lines)

print(f"Fixed duplicate equipment code on line 100")
print(f"Changed PMP-CEN-006 to PMP-CEN-099 for 'Shaft Misalignment'")