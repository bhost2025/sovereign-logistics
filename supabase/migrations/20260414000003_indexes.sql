CREATE INDEX idx_containers_company   ON public.containers(company_id);
CREATE INDEX idx_containers_status    ON public.containers(current_status);
CREATE INDEX idx_containers_number    ON public.containers(container_number);
CREATE INDEX idx_status_log_container ON public.container_status_log(container_id);
CREATE INDEX idx_invoices_container   ON public.invoices(container_id);
CREATE INDEX idx_users_company        ON public.users(company_id);
