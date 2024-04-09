provider "google" {
  credentials = file("hephaestus-418809-ba3b07f622bf.json")
  project     = "hephaestus-418809"
  region      = "us-west1"
  zone        = "us-west1-a"
}

resource "google_cloud_run_service" "default" {
  name     = "hephaestus-api"
  location = "us-west1"

  template {
    spec {
      containers {
        image = "gcr.io/hephaestus-418809/hephaestus-api:latest"

        ports {
          container_port = 4000
        }

        env {
          name  = "DATABASE_USER"
          value = "hephaestus-db"
        }
        env {
          name  = "DATABASE_PASSWORD"
          value = base64decode(var.db_password)
        }
        env {
          name  = "DATABASE_NAME"
          value = "hephaestus-postgres"
        }

        env {
          name  = "JWT_PRIVATE_KEY"
          value = var.jwt_private_key
        }

      }
    }

    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.default.connection_name
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

output "service_url" {
  value = google_cloud_run_service.default.status[0].url
}
