export function Pagination({ page, hasMore, href }: {
  page: number; hasMore: boolean; href: (page: number) => string;
}) {
  if (page === 1 && !hasMore) return null
  return (
    <nav className="feature-pagination" aria-label="Páginas de resultados">
      {page > 1 && <a className="feature-button secondary" href={href(page - 1)} rel="prev">Anterior</a>}
      <span>Página {page}</span>
      {hasMore && <a className="feature-button secondary" href={href(page + 1)} rel="next">Siguiente</a>}
    </nav>
  )
}
