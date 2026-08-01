-- v6: reparar usernames generados con el bug del índice negativo
-- ("Cuervo undefined #9627" → "Cuervo #9627").
update public.profiles
set username = replace(username, ' undefined', '')
where username like '% undefined %';
