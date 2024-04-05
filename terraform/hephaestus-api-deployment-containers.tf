resource "kubernetes_deployment" "hephaestus_api_deployment_containers" {
  depends_on = [
    google_container_cluster.hephaestus_api_cluster,
  ]
  provider = kubernetes.gke

  metadata {
    name = "hephaestus_api_deployment_containers"
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "hephaestus_api"
      }
    }

    template {
      metadata {
        labels = {
          app = "hephaestus_api"
        }
      }

      spec {
        container {
          name  = "hephaestus_api"
          image = "gcr.io/hephaestus-418809/hephaestus-api:latest"

          port {
            container_port = 8080
          }

          port {
            container_port = 4000
          }
        }

        container {
          name  = "cloud_sql_proxy"
          image = "gcr.io/cloudsql-docker/gce-proxy:1.19.1"

          command = [
            "/cloud_sql_proxy",
            "-instances=hephaestus-418809:us-east1:hephaestus-postgres=tcp:5432",
            "-credential_file=/secrets/cloudsql/credentials.json"
          ]

          volume_mount {
            name       = "cloudsql_instance_credentials"
            mount_path = "/secrets/cloudsql"
            read_only  = true
          }

          port {
            name           = "5432"
            container_port = 5432
          }
        }

        volume {
          name = "cloudsql_instance_credentials"

          secret {
            secret_name = kubernetes_secret.cloudsql_creds.metadata[0].name
          }
        }
      }
    }
  }
}
