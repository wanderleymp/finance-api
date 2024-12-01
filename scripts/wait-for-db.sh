#!/bin/sh

set -e

host="postgres"
port="5432"
cmd="$@"

until nc -z "$host" "$port"; do
  echo >&2 "Postgres is unavailable - sleeping"
  sleep 1
done

echo >&2 "Postgres is up - executing command"
exec $cmd
