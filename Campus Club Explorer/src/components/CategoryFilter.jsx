function CategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <div className="category-filter" aria-label="Filter clubs by vertical">
      {categories.map((category) => (
        <button
          className={activeCategory === category ? 'filter-pill active' : 'filter-pill'}
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

