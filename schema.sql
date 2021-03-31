DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
  ID SERIAL primary key not null,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(20, 14),
  longitude NUMERIC(20, 14)
);

