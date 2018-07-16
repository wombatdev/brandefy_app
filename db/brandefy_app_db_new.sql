-- use Brandefy_production;

-- create database Brandefy_app;
create database Brandefy_app;
use Brandefy_app;

show databases;

-- drop table reatil_brand;
create table retailers
(
id int auto_increment,
brands bit,
r_name varchar(250),
primary key (id)
);

create table brands
(
bid int auto_increment,
b_name varchar(250),
retail_id int null,
primary key (bid),
FOREIGN KEY (retail_id)
        REFERENCES retailers(id)
);


create table product_review_requests(
id int auto_increment,
product_name varchar(2500),	
store_name varchar(2500),
email varchar(300),
can_help bit,
date_added datetime,
primary key(id)
);

create table subscribers(
id int auto_increment,
email varchar(300) not null,
date_added datetime,
primary key(id)
);

create table feedback(
id int auto_increment,
fname varchar(500),
email varchar(300),
message varchar(2500) not null,
date_added datetime,
primary key(id)
);


create table users(
uid int auto_increment,
ufname varchar(250),
lname varchar(250),
date_added datetime,
email varchar(250),
subscribed bit,
primary key(uid)
);

create table category_types(
id int auto_increment,
level varchar(50),
categories bit,
primary key(id)
);

create table categories(
id int auto_increment,
c_name varchar(50),
type_id int,
primary key (id),
FOREIGN KEY (type_id)
        REFERENCES category_types(id)
);

create table category_rels(
id int auto_increment,
parent_cid int,
child_cid int,
primary key (id),
FOREIGN KEY (parent_cid)
        REFERENCES categories(id),
FOREIGN KEY (child_cid)
        REFERENCES categories(id)
);


create table ingredients(
id int auto_increment,
i_name varchar(5000),
synonyms varchar(5000),
issulfate bit,
isparaben bit,
primary key(id)
);

create table product_attr(
id int auto_increment,
attr_name varchar(500),
primary key(id)
);

create table products(
id int auto_increment,
UPCA char(13), /*since the upca codes are 13 digits long*/
p_name varchar(2500),
brand_id int,
Primary key(id),
FOREIGN KEY (brand_id)
        REFERENCES brands(bid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


create table product_attr_val(
id int auto_increment,
a_id int,
a_value varchar(5000),
primary key(id),
FOREIGN KEY (a_id)
        REFERENCES product_attr(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- produt attributes categories and product categories and sub categories to come up

create table product_comp
(
id int auto_increment,
brand_pid int,
generic_pid int,
-- brand_pname varchar(250),
-- retailer_pname varchar(250),
-- image_link varchar(500),
-- image_link_both varchar(500),
overall_similarity decimal(5,2),
ingredient_match decimal(5,2),
-- active_match decimal(5,2),
-- inactive_match decimal(5,2),
b_review varchar(5000),
primary key (id),
UNIQUE(brand_pid,generic_pid),
FOREIGN KEY (brand_pid)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
FOREIGN KEY (generic_pid)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- drop table product_reviews;

create table product_reviews(
id int auto_increment,
p_id int,
u_id int,
review varchar(5000) not null,
date_added datetime,
primary key(id),
FOREIGN KEY (p_id)
        REFERENCES product_comp(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
FOREIGN KEY (u_id)
        REFERENCES users(uid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
        
);


create table product_ingredients(
id int auto_increment,
p_id int,
i_id int,
active bit,
concentration decimal(5,2),
UNIQUE(p_id,i_id),
primary key(id),
FOREIGN KEY (p_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
FOREIGN KEY (i_id)
        REFERENCES ingredients(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

create table product_images(
id int auto_increment,
p_id int,
image_link varchar(5000),
primary_link bit,
primary key(id),
FOREIGN KEY (p_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

create table product_categories(
id int auto_increment,
p_id int,
c_id int,
UNIQUE(p_id, c_id),
primary key(id),
FOREIGN KEY (p_id)
        REFERENCES products(id),
FOREIGN KEY (c_id)
        REFERENCES categories(id)
);


