provider "google" {
  credentials = file("hephaestus-418809-26f13a75446e.json")
  project     = "hephaestus-418809"
  region      = "us-east1"
}

resource "kubernetes_secret" "cloudsql_creds" {
  metadata {
    name = "cloudsql-instance-credentials"
  }

  data = {
    "credentials.json" = file("hephaestus-418809-26f13a75446e.json")
  }
}


resource "google_container_cluster" "hephaestus-api-cluster" {
  name     = "hephaestus-api-cluster"
  location = "us-east1"
  deletion_protection = false

  remove_default_node_pool = true


  node_pool {
    name       = "hephaestus-api-cluster-pool"
    node_count = 1

    node_config {
      machine_type = "e2-micro"
    }
  }
}

provider "kubernetes" {
  host                   = google_container_cluster.hephaestus-api-cluster.endpoint
  token                  = data.google_client_config.current.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.hephaestus-api-cluster.master_auth[0].cluster_ca_certificate)
}

data "google_client_config" "current" {}