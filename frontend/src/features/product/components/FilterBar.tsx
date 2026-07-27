interface FilterBarProps {
  search: string;
  sortBy: string;
  sortOrder: string;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: string) => void;
}

export function FilterBar({
  search,
  sortBy,
  sortOrder,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant
            rounded-lg text-sm text-on-surface placeholder:text-outline
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            transition-colors duration-150"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant
            rounded-lg text-sm text-on-surface
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            transition-colors duration-150"
        >
          <option value="">Ordenar por</option>
          <option value="price">Precio</option>
          <option value="name">Nombre</option>
          <option value="stock">Stock</option>
        </select>

        <button
          onClick={() =>
            onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')
          }
          disabled={!sortBy}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant
            rounded-lg text-sm text-on-surface hover:bg-surface-container
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150"
          title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}
