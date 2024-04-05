provider "google" {
  credentials = file("hephaestus-418809-26f13a75446e.json")
  project     = "hephaestus-418809"
  region      = "us-east1-b"
}

resource "google_service_account" "this" {
  account_id   = "hephaestus-418809"
  display_name = "Compute Engine default service account"
}

resource "kubernetes_secret" "this" {
  metadata {
    name = "cloudsql-instance-credentials"
  }

  data = {
    "credentials.json" = file("hephaestus-418809-26f13a75446e.json")
  }

  depends_on = [
    google_container_cluster.this,
  ]

  provider = kubernetes.gke

}


resource "google_container_cluster" "this" {
  name                = "hephaestus-api-cluster"
  location            = "us-east1-b"
  deletion_protection = false
  # remove_default_node_pool = true
  # initial_node_count       = 1

  node_pool {
    name       = "hephaestus-api-cluster-pool"
    node_count = 1

    node_config {
      machine_type = "e2-micro"
    }
  }


}

# resource "google_container_node_pool" "primary_preemptible_nodes" {
#   name       = "hephaestus_api_node_pool"
#   cluster    = hephaestus_api_cluster.id
#   node_count = 1

#   node_config {
#     preemptible  = true
#     machine_type = "e2-micro"

#     # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
#     service_account = google_service_account.default.email
#     oauth_scopes = [
#       "https://www.googleapis.com/auth/cloud-platform"
#     ]
#   }
# }



provider "kubernetes" {
  config_path = "~/.kube/config"
  alias       = "gke"
  host        = "https://${google_container_cluster.this.endpoint}"
  token       = data.google_client_config.this.access_token
  cluster_ca_certificate = base64decode(
    google_container_cluster.this.master_auth[0].cluster_ca_certificate
  )
}

data "google_client_config" "this" {}
