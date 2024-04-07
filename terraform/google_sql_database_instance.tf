resource "google_sql_database_instance" "default" {
  name             = "my-cloudsql-instance"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier = "db-f1-micro"
  }
}
