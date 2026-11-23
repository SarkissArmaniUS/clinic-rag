create extension if not exists vector;

create table if not exists documents (
  id bigint generated always as identity primary key,
  source text not null,
  content text not null,
  embedding vector(3072) not null
);

create or replace function match_documents(
  query_embedding vector(3072),
  match_count int default 4,
  min_similarity float default 0.55
)
returns table (id bigint, source text, content text, similarity float)
language sql stable
as $$
  select
    d.id,
    d.source,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) >= min_similarity
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

alter table documents enable row level security;
