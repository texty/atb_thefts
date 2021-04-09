library("dplyr")
library("tidyr")
library("stringr")
library('xlsx')
library("readxl")
library("ggplot2")
library(scales)


# ті продукти, що вже начистили, подивитись розкид по товарам і середню вартість крадіжки
# products <- read.csv("/home/yevheniia/Desktop/atb_doc_copy/atb_185_v.1.xlsx - 24_03.csv", stringsAsFactors = F) %>% 
products <- read.csv("/home/yevheniia/git/2021_YEAR/atb_thefts/origin_data/atb_185_28_03_refined.csv", stringsAsFactors = F) %>% 
  select(-is_interesting, -why) %>% 
  filter(!is.na(товар)) %>% 
  mutate(сума = as.numeric(сума),
         вартість = as.numeric(вартість),
         сума =  ifelse(is.na(сума) & шт == 1, вартість, сума),  
         сума =  ifelse(is.na(сума) & шт > 1, вартість * шт, сума),
         сума =  ifelse(is.na(сума) & is.na(шт), вартість, сума),
         вартість = ifelse(is.na(вартість), сума / шт, вартість)
  ) %>% 
  mutate(товар = sub(" та м'ясні продукти", "", товар),
              товар = sub("молочна продукція", "молочка", товар),
              товар = sub("ковбаса та ковбасні вироби", "ковбаса", товар),
              товар = sub("напій безалкогольний", "напої", товар),
              товар = sub("хлібобулочні вироби", "хліб", товар),
              товар = sub("макаронні вироби", "макарони", товар)
  )


#  дані для першої heat карти
heat_data_pre = products %>% 
  group_by(id, дата) %>% #групуємо по даті та id, щоб знати що винесли за раз
  
  # яке співвідношення кількість-категорія у кожній крадіжці
  mutate(amount = sum(шт), #скільки всього товару у крадіжці
         diversity = n_distinct(товар)) %>% #скільки категорій товару
  ungroup() %>% 
  # прибираємо непотрібні колонки
  select(id, дата, amount, diversity) %>%  
  # нам потрібно співідношення кількості та різноманітності для кожної крадіжки, видаляємо повтори
  distinct(id, дата, .keep_all = T) %>% 
  filter(!is.na(amount)) %>% 
  
  #рахуємо, скільки в нас всього крадіжок для кожної x(amount) та y(diversity)
  group_by(amount, diversity) %>% 
  mutate(value = n()) %>% 
  ungroup() %>%
  rename(x=amount, y=diversity) 
  
  
heat_data = heat_data_pre %>% 
  select(x,y,value) %>% 
  unique() %>% 
  uncount(value)
  
  
write.csv(heat_data, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/heat_data.csv", row.names = F)

# рахуємо де по x/y знаходиться кожна крадіжка
thefts_xy = heat_data_pre %>% 
  select(id, дата, x, y)

thefts_amount = heat_data_pre %>% 
  select(x,y,value) %>% 
  unique() %>% 
  rename(thefts_amount = value)

# переносимо знайдені x та y для крадіжки на кожен товар в цій крадіжці,
# а потім рахуємо скільки кожен товар зустрічається в кожній пару xy
word_cloud = products %>% 
  select(1,2,5,7) %>% 
  mutate(шт = replace_na(шт, 1)) %>% 
  uncount(шт) %>% 
  left_join(thefts_xy, by=c("id", "дата")) %>% 
  select(товар,x,y) %>% 
  group_by(товар,x,y) %>% 
  mutate(freq = n()) %>% 
  ungroup() %>% 
  unique() %>% 
  filter(!is.na(x)) %>% 
  left_join(thefts_amount, by=c("x", "y"))

write.csv(word_cloud, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/word_cloud.csv", row.names = F)

# можливо є сенс перемалювати статичною
sum_amount = products %>% 
  select(1,2,7,10) %>% 
  mutate(шт = replace_na(шт, 1)) %>% 
  uncount(шт) %>% 
  filter(!is.na(вартість)) %>% 
  group_by(товар) %>% 
  mutate(сума = sum(вартість),
             amount = n()) %>% 
  ungroup() %>% 
  select(-id, -вартість) %>% 
  unique() %>% 
  filter(amount > 10) %>% 
  filter(товар != "товар") %>%
  uncount(amount, .remove=FALSE) %>% 
  # filter(товар %in% most_pop$товар)
  rename(x=сума, y=amount, name=товар)

write.csv(sum_amount, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/sum_amount.csv", row.names = F)


# обери товар, подивись, що з ним крадуть найчастіше

# топ-50 найпопулірніших товарів і що з ними крадуть
most_pop = products %>% 
  group_by(назва.товару) %>% 
  mutate(freq = n()) %>% 
  ungroup() %>% 
  select(назва.товару, freq) %>% 
  unique() %>% 
  arrange(desc(freq)) %>% 
  filter(назва.товару != "") %>% 
  head(40) %>% 
  filter(назва.товару != "візок закупівельний") 


getConnectedProducts = function(product, column){
  test = products %>% 
    select(id,!!as.symbol(column)) %>% 
    group_by(id) %>% 
    filter(any(!!as.symbol(column) == product)) %>% 
    ungroup() %>% 
    
    # щоб прибрати перший випадок зустрічання цільового товару
    # group_by(id, !!as.symbol(column)) %>% 
    # mutate(gg = row_number()) %>% 
    # ungroup() %>% 
    # filter(!!as.symbol(column) != product | gg != 1) %>% 
    filter(!!as.symbol(column) != product) %>% 
    # unique() %>% 
    select(-id) %>% 
    group_by(!!as.symbol(column)) %>% 
    mutate(freq = n()) %>% 
    ungroup() %>% 
    unique() %>% 
    arrange(desc(freq)) %>% 
    head(10)
  
  return(test)
}

# test = products %>%
#   select(id, назва.товару) %>%
#   group_by(id) %>%
#   filter(any(назва.товару == "візок закупівельний")) %>%
#   ungroup() %>%
#   filter(назва.товару != "візок закупівельний") %>%
#   unique() %>%
#   select(-id) %>%
#   group_by(назва.товару) %>%
#   mutate(freq = n()) %>%
#   ungroup() %>%
#   unique() %>%
#   arrange(desc(freq)) %>%
#   head(10)

getConnectedProducts("ковбаса", "назва.товару")

related_prod = data.frame()
for(i in 1:length(most_pop$назва.товару)){
  temp = getConnectedProducts(most_pop$назва.товару[i], "назва.товару")
  temp$target = most_pop$назва.товару[i]
  temp$sort = most_pop$freq[i]
  related_prod <- rbind(related_prod, temp)
}
related_prod = related_prod %>% 
  rename(detail = назва.товару)


write.csv(related_prod, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/related_prod.csv", row.names = F)

person <- read_excel("/home/yevheniia/git/2021_YEAR/atb_thefts/origin_data/person_v.1.xlsx", sheet=1, col_names = TRUE, col_types=NULL, na="",skip=0) %>% 
  filter(id %in% products$id) 

person_colnames = c("Чи працює", "Освіта", "Чи перебуває у шлюбі", 
             "Чи є діти", "Чи був попередньо засуджений", "Стать",
             "Неповнолітня особа (TRUE)", "Пенсіонер (TRUE)", 
             "Чи ще навчається (TRUE)", "Особа позбавлена батьківських прав (TRUE)",
             "Особа у декретній відпусці (TRUE)")

portrait = data.frame()

for(i in 1:length(person_colnames)){
  df = person %>% 
    rename(options = !!as.symbol(person_colnames[i])) %>% 
    mutate(options = na_if(options, "NA"),
           options = na_if(options, "na")
           ) %>% 
    select(id, options) %>% 
    group_by(options) %>% 
    mutate(freq = n()) %>% 
    ungroup() %>% 
    select(options, freq) %>% 
    unique()
    
  df$category = person_colnames[i]
  portrait = rbind(portrait, df)
  
}

portrait1 = portrait %>% 
   filter(str_detect(category, "TRUE")) %>% 
    filter(!is.na(options)) %>% 
    mutate(options = category,
           options = sub(" \\(TRUE\\)", "", options),
           category = "Інше"
           )

portrait2 = portrait %>% 
  filter(!str_detect(category, "TRUE")) %>% 
   mutate(options = ifelse(is.na(options), "не зазначено", options)) 

dictionary = read.csv("/home/yevheniia/git/2021_YEAR/atb_thefts/R/person_dict.csv", stringsAsFactors = F) %>% 
  select(1,3)

portrait = rbind(portrait1, portrait2) %>% 
  mutate(options =  as.character(options)) %>% 
  left_join(dictionary, by="options") %>% 
  unique() %>% 
  filter(category != "Інше") %>% 
  mutate(category = sub("Чи працює", "Робота", category),
         category = sub("Чи перебуває у шлюбі", "Сімейний стан", category),
         category = sub("Чи є діти", "Діти", category),
         category = sub("Чи був попередньо засуджений", "Судимість", category)
   ) %>% 
  mutate(percent = round(freq/(1357/100)) ) %>% 
  filter(percent > 0)

sum(portrait$percent)

write.csv(portrait, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/portrait.csv", row.names = F)


alko = products %>% 
  select(1,2,3,4,7,9,10,11) %>% 
  filter(товар == "алкоголь") %>% 
  mutate(шт = replace_na(шт, 1),
        літрів = as.numeric(літрів),
        літрів = replace_na(літрів, 0.5),
        літрів = as.numeric(літрів),
        сума = replace_na(сума, 0)
        ) %>% 
  mutate(total = шт * літрів)
  
sum(alko$total)
sum(alko$сума)

types = data.frame(table(alko$назва.товару)) %>% 
  rename(label = Var1) %>% 
  mutate(label = as.character(label),
         label = ifelse(Freq < 17, "інше", label)) %>% 
  group_by(label) %>% 
  mutate(freq = sum(Freq)) %>% 
  ungroup() %>% 
  select(-Freq) %>% 
  unique() %>% 
  mutate(percent = round(freq / 12.99),
         category = "алкоголь") %>% 
  select(-freq) %>% 
  arrange(desc(percent)) %>% 
  spread(label, percent)

write.csv(types, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/alko_types.csv", row.names = F)

# чи непокаране зло породжує більше, тобто чи більша сума крадіжки, коли повертається вдруге та втретє
library(RColorBrewer)

multiple = products %>% 
  select(-заповнив, -марка, -шт, -грам, -літрів, -вартість) %>% 
  mutate(час = ifelse(час == "", "00:00", час),
         date = paste(дата, час, sep=" ")) %>% 
  group_by(id) %>% 
  mutate(return = n_distinct(date)) %>% 
  ungroup() %>% 
  filter(return > 1) %>% 
  arrange(id, дата, час) %>% 
  select(-товар, -назва.товару, -return) %>% 
  filter(!is.na(сума)) %>% 
  group_by(id, дата, час) %>% 
  summarise(total = sum(сума)) %>% 
  ungroup() %>% 
  filter(дата != "") %>% 
  mutate(дата = as.Date(дата, format="%d.%m.%Y")) %>% 
  arrange(id, дата, час) %>% 
  group_by(id) %>% 
  mutate(count = row_number()) %>% 
  ungroup() %>% 
  select(-дата, -час) %>% 
  arrange(id, count) %>% 
  group_by(id) %>% 
  mutate(freq = n()) %>% 
  mutate(dif = total - lag(total, default = first(total)), 
         p_total = lag(total, default=first(total))) %>% 
  mutate(percent = round(total / (lag(total)/100)),
         percent = replace_na(percent, 100)) %>% 
  ungroup() %>% 
  mutate(id=as.character(id)) %>% 
  filter(percent < 1000) %>% 
  mutate(color = ifelse(percent > 100, "більшу", ifelse(percent < 100, "меншу", "однакову"))) %>% 
  arrange(id, count) 

# підбираємо кут для дерева
for(i in 1:length(multiple$id)){
  if(multiple$count[i] == 1){
    multiple$start[i] = 100
    multiple$end[i] = 100
  } else if(multiple$count[i] == 2 & multiple$percent[i] > 100){
    multiple$start[i] = 100
    multiple$end[i] = 100 + runif(1,5,10)
  } else if(multiple$count[i] == 2 & multiple$percent[i] < 100){
    multiple$start[i] = 100
    multiple$end[i] = 100 - runif(1,5,10)
  } else if(multiple$count[i] == 2 & multiple$percent[i] == 100){
    multiple$start[i] = 100
    multiple$end[i] = 100
  } else if(multiple$count[i] > 2 & multiple$percent[i] > 100){
    multiple$start[i] = multiple$end[i-1]
    multiple$end[i] = multiple$start[i] + runif(1,5,10)
  } else if(multiple$count[i] > 2 & multiple$percent[i] < 100){
    multiple$start[i] = multiple$end[i-1]
    multiple$end[i] = multiple$start[i] - runif(1,5,10)
  } else if(multiple$count[i] > 2 & multiple$percent[i] == 100){
    multiple$start[i] = multiple$end[i-1]
    multiple$end[i] = multiple$end[i-1]
  } 
}

multiple = multiple %>% 
  mutate(curvature = rescale(dif, from=c(min(dif), max(dif)), to = c(-120, 120)))

 start = multiple %>% 
   select(id,count,start) %>% 
   mutate(type='start') %>% 
   rename(value=start)
 
 end = multiple %>% 
   select(id,count,end) %>% 
   mutate(type='end') %>% 
   rename(value=end) %>% 
   mutate(count = count+0.5)       
          
 tree_data = bind_rows(start, end)  %>% 
   mutate(count = count * 10)
 
 tree_data1 = multiple %>% 
   select(id,count,color,start,end,curvature, dif) %>% 
   mutate(ystart = count-1) %>% 
   rename(yend=count)
 
 write.csv(tree_data1, "/home/yevheniia/git/2021_YEAR/atb_thefts/data/tree_data.csv", row.names = F)
