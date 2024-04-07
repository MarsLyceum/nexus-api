resource "google_sql_database_instance" "default" {
  name             = "hephaestus-postgres"
  region           = "us-central1"
  database_version = "POSTGRES_15"

  settings {
    tier = "db-f1-micro"
  }
}

variable "db_password" {
  description = "The password for the database"
  type        = string
  sensitive   = true
}

resource "google_sql_database" "default" {
  name     = "hephaestus-postgres"
  instance = google_sql_database_instance.default.name
}

resource "google_sql_user" "default" {
  name     = "hephaestus-db"
  instance = google_sql_database_instance.default.name
  password = base64decode(var.db_password)
}
