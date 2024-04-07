provider "google" {
  credentials = file("hephaestus-418809-ba3b07f622bf.json")
  project     = "hephaestus-418809"
  region      = "us-central1"
}

resource "google_cloud_run_service" "this" {
  name     = "google-cloud-run-service"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/hephaestus-418809/hephaestus-api:latest"

        ports {
          container_port = 4000
        }

      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

output "service_url" {
  value = google_cloud_run_service.this.status[0].url
}
