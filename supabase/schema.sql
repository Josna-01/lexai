-- Enable pgvector extension
create extension if not exists vector;

-- Legal document chunks table
create table legal_chunks (
  id          uuid primary key default gen_random_uuid(),
  act         text not null,
  section     text,
  heading     text,
  year        int,
  content     text not null,
  embedding   vector(768),
  created_at  timestamptz default now()
);

-- Similarity search function
create or replace function match_documents(
  query_embedding vector(768),
  match_count     int default 5
)
returns table (
  id        uuid,
  act       text,
  section   text,
  heading   text,
  content   text,
  similarity float
)
language sql stable
as $$
  select
    id, act, section, heading, content,
    1 - (embedding <=> query_embedding) as similarity
  from legal_chunks
  order by embedding <=> query_embedding
  limit match_count;
$$;
