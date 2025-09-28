#!/bin/bash

# Fix return types in all route files
echo "Fixing TypeScript return types..."

# Add Response import and fix return statements in all route files
for file in src/routes/*.ts; do
  echo "Processing $file"

  # Add Response import if not present
  if ! grep -q "Response" "$file"; then
    sed -i "s/import { Router }/import { Router, Response }/" "$file"
  fi

  # Fix async function return types and return statements
  sed -i "s/async (req.*res).*=> {/async (req, res): Promise<Response> => {/g" "$file"
  sed -i "s/    res\./    return res./g" "$file"
  sed -i "s/  res\./  return res./g" "$file"
done

echo "Type fixes complete!"