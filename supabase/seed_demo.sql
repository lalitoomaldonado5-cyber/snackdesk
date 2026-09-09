-- OPTIONAL. Run only AFTER creating a user through /register.
-- Replace demo@example.com with that user's email. Use an empty demo business.
-- This script changes only that business, and rolls back entirely on failure.
begin;
do $$
declare
  owner_email text := 'demo@example.com';
  biz uuid; c1 uuid; c2 uuid; c3 uuid; e1 uuid; e2 uuid; e3 uuid;
begin
  select p.business_id into biz from public.profiles p join auth.users u on u.id=p.id
  where lower(u.email)=lower(owner_email) and p.role='owner';
  if biz is null then raise exception 'Primero crea una cuenta y reemplaza owner_email.'; end if;
  if exists(select 1 from public.clients where business_id=biz)
     or exists(select 1 from public.expenses where business_id=biz)
     or exists(select 1 from public.service_packages where business_id=biz)
  then raise exception 'El negocio ya tiene datos. Usa un negocio vacío para el demo.'; end if;
  update public.businesses set name='Yummy Gummy Snack Bar',phone='55 0000 0000' where id=biz;
  insert into public.clients(business_id,name,phone,email,notes) values(biz,'Ana Rodríguez','55 0000 0001','ana@example.com','Prefiere snacks sin picante.') returning id into c1;
  insert into public.clients(business_id,name,phone,email,notes) values(biz,'Ximena Torres','55 0000 0002','ximena@example.com','Celebración de XV años para Camila.') returning id into c2;
  insert into public.clients(business_id,name,phone,email,notes) values(biz,'Fernanda Ruiz','55 0000 0003','fernanda@example.com','Coordinadora de la boda.') returning id into c3;
  insert into public.events(business_id,client_id,title,event_type,event_date,event_time,location,guest_count,total_amount,status)
    values(biz,c1,'Cumpleaños Ana','Cumpleaños','2026-09-17','16:00','Jardín Los Olivos',80,3800,'reserved') returning id into e1;
  insert into public.events(business_id,client_id,title,event_type,event_date,event_time,location,guest_count,total_amount,status)
    values(biz,c2,'XV años Camila','XV años','2026-09-24','18:00','Salón Magnolia',120,6800,'quoted') returning id into e2;
  insert into public.events(business_id,client_id,title,event_type,event_date,event_time,location,guest_count,total_amount,status)
    values(biz,c3,'Boda Mar & Luis','Boda','2026-09-30','19:00','Hacienda San Rafael',150,8900,'reserved') returning id into e3;
  insert into public.payments(business_id,event_id,amount,payment_type,payment_date,notes) values
    (biz,e1,1500,'deposit','2026-09-01','Anticipo por transferencia.'),
    (biz,e3,8900,'final','2026-09-02','Liquidación.');
  insert into public.expenses(business_id,event_id,description,category,amount,expense_date) values
    (biz,e1,'Snacks y desechables','Insumos',650,'2026-09-02'),
    (biz,e3,'Compra de insumos para boda','Insumos',1800,'2026-09-02'),
    (biz,null,'Material de limpieza','Otros',350,'2026-09-02');
  insert into public.service_packages(business_id,name,description,base_price) values
    (biz,'Barra clásica','Selección de snacks, dulces y toppings. Montaje y servicio incluidos.',3800),
    (biz,'Barra celebración','Más variedad y una presentación especial para eventos grandes.',6800);
end $$;
commit;
