# UI Design Package

This package contains custom UI components built on top of shadcn/ui components. It serves as a design system layer that provides higher-level, business-specific components while leveraging the base shadcn/ui components.

## Architecture

```
packages/
├── ui/           # Base shadcn/ui components
└── ui-design/    # Custom components built on top of ui/
```

## Dependencies

- `@workspace/ui` - Base shadcn/ui components
- `react` & `react-dom` - React dependencies
- `clsx` & `tailwind-merge` - Utility functions

## Available Components

### Wrapper Components

Simple wrapper components that use shadcn components internally with a clean API:

#### SharedButton

```tsx
import { SharedButton } from "@workspace/ui-design";

<SharedButton
  title="Click me"
  variant="outline"
  onClick={() => console.log("clicked")}
/>;
```

#### SharedInput

```tsx
import { SharedInput } from "@workspace/ui-design";

<SharedInput
  placeholder="Enter text"
  onChange={(value) => console.log(value)}
/>;
```

#### SharedCard

```tsx
import { SharedCard } from "@workspace/ui-design";

<SharedCard className="max-w-md">
  <h3>Card Content</h3>
  <p>This is a simple card wrapper.</p>
</SharedCard>;
```

### Complex Components

#### Card

A flexible card component with multiple variants:

- `default` - Standard card with subtle shadow
- `outlined` - Transparent background with prominent border
- `elevated` - Stronger shadow for emphasis

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui-design";

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content goes here</CardContent>
</Card>;
```

#### DataTable

A feature-rich data table component with:

- Search functionality
- Pagination
- Custom column rendering
- Responsive design

```tsx
import { DataTable } from "@workspace/ui-design";

const data = [{ id: 1, name: "John Doe", email: "john@example.com" }];

const columns = [
  { key: "id" as const, header: "ID" },
  { key: "name" as const, header: "Name" },
  { key: "email" as const, header: "Email" },
];

<DataTable data={data} columns={columns} searchable={true} />;
```

## Usage in Apps

To use this package in your frontend app:

1. Install the package:

```bash
pnpm add @workspace/ui-design@workspace:*
```

2. Import components:

```tsx
import { Card, DataTable } from "@workspace/ui-design";
```

3. Use wrapper components with simple API:

```tsx
import { SharedButton, SharedInput, SharedCard } from "@workspace/ui-design";

<SharedCard>
  <SharedInput placeholder="Enter name" />
  <SharedButton title="Submit" />
</SharedCard>;
```

## Development

- Add new components in `src/components/`
- Export them in `src/index.ts`
- Update this README with documentation
- Test components in the demo page at `apps/web/app/ui-demo/`

## Benefits of This Approach

1. **Separation of Concerns**: Base components vs. business components
2. **Reusability**: Custom components can be used across multiple apps
3. **Consistency**: Ensures design consistency across the monorepo
4. **Maintainability**: Changes to design system are centralized
5. **Type Safety**: Full TypeScript support with proper type inference
